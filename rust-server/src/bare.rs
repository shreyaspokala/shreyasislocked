use axum::{
    body::Body,
    extract::{Request, State},
    http::{header::HeaderName, HeaderMap, HeaderValue, Method, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use futures_util::TryStreamExt;
use reqwest::Url;
use serde::Serialize;
use serde_json::{Map, Value};
use std::str::FromStr;

use crate::AppState;

#[derive(Serialize)]
pub struct BareMeta {
    pub versions: Vec<&'static str>,
    pub language: &'static str,
    #[serde(rename = "memoryUsage")]
    pub memory_usage: u64,
    pub maintainer: Value,
    pub project: Value,
}

pub async fn index() -> impl IntoResponse {
    Json(BareMeta {
        versions: vec!["v3"],
        language: "Rust",
        memory_usage: 0,
        maintainer: serde_json::json!({ "email": "noreply@example.com", "website": "https://example.com" }),
        project: serde_json::json!({
            "name": "shreyasislocked-bare",
            "description": "Minimal bare v3 in Rust",
            "repository": "https://example.com",
            "version": "0.1.0"
        }),
    })
}

fn bad(msg: &str) -> Response {
    (StatusCode::BAD_REQUEST, Json(serde_json::json!({"code":"INVALID_BARE_HEADER","message":msg}))).into_response()
}

fn header_str<'a>(h: &'a HeaderMap, name: &str) -> Option<&'a str> {
    h.get(name).and_then(|v| v.to_str().ok())
}

pub async fn v3(State(state): State<AppState>, req: Request) -> Response {
    let method = req.method().clone();
    let headers = req.headers().clone();

    // Handle CORS preflight
    if method == Method::OPTIONS {
        return cors_response(StatusCode::NO_CONTENT, HeaderMap::new(), Body::empty());
    }

    let host = match header_str(&headers, "x-bare-host") { Some(h) => h.to_string(), None => return bad("missing x-bare-host") };
    let port = match header_str(&headers, "x-bare-port").and_then(|p| p.parse::<u16>().ok()) { Some(p) => p, None => return bad("missing/invalid x-bare-port") };
    let protocol = header_str(&headers, "x-bare-protocol").unwrap_or("https:").to_string();
    let path = header_str(&headers, "x-bare-path").unwrap_or("/").to_string();
    let raw_headers = header_str(&headers, "x-bare-headers").unwrap_or("{}").to_string();
    let forward = header_str(&headers, "x-bare-forward-headers").unwrap_or("[]").to_string();
    let pass_headers = header_str(&headers, "x-bare-pass-headers").unwrap_or("[]").to_string();
    let pass_status = header_str(&headers, "x-bare-pass-status").unwrap_or("[]").to_string();

    let fwd_list: Vec<String> = serde_json::from_str(&forward).unwrap_or_default();
    let pass_h_list: Vec<String> = serde_json::from_str(&pass_headers).unwrap_or_default();
    let pass_s_list: Vec<u16> = serde_json::from_str(&pass_status).unwrap_or_default();
    let bare_hdrs: Map<String, Value> = serde_json::from_str(&raw_headers).unwrap_or_default();

    let scheme = if protocol.trim_end_matches(':') == "http" { "http" } else { "https" };
    let url_str = if (scheme == "https" && port == 443) || (scheme == "http" && port == 80) {
        format!("{}://{}{}", scheme, host, path)
    } else {
        format!("{}://{}:{}{}", scheme, host, port, path)
    };
    let url = match Url::parse(&url_str) { Ok(u) => u, Err(_) => return bad("invalid target url") };

    let mut out_headers = reqwest::header::HeaderMap::new();
    for (k, v) in bare_hdrs {
        if let (Ok(n), Some(vs)) = (HeaderName::from_bytes(k.as_bytes()), v.as_str()) {
            if let Ok(hv) = HeaderValue::from_str(vs) { out_headers.insert(n, hv); }
        }
    }
    for name in fwd_list {
        if let Some(val) = headers.get(name.as_str()) {
            if let Ok(n) = HeaderName::from_str(&name) {
                out_headers.insert(n, val.clone());
            }
        }
    }

    let (parts, body) = req.into_parts();
    let _ = parts;
    let body_bytes = match axum::body::to_bytes(body, 32 * 1024 * 1024).await {
        Ok(b) => b,
        Err(_) => return bad("body too large"),
    };

    let mut rb = state.http.request(method, url).headers(out_headers);
    if !body_bytes.is_empty() { rb = rb.body(body_bytes.to_vec()); }
    let resp = match rb.send().await {
        Ok(r) => r,
        Err(e) => return (StatusCode::BAD_GATEWAY, Json(serde_json::json!({"code":"UNKNOWN","message":format!("upstream: {}", e)}))).into_response(),
    };

    let upstream_status = resp.status();
    let mut resp_headers_json = Map::new();
    for (k, v) in resp.headers() {
        let key = k.as_str().to_ascii_lowercase();
        let val = v.to_str().unwrap_or("").to_string();
        let entry = resp_headers_json.entry(key).or_insert(Value::Null);
        match entry {
            Value::Null => *entry = Value::String(val),
            Value::String(s) => {
                let arr = Value::Array(vec![Value::String(std::mem::take(s)), Value::String(val)]);
                *entry = arr;
            }
            Value::Array(arr) => arr.push(Value::String(val)),
            _ => {}
        }
    }

    let pass_status_ok = pass_s_list.contains(&upstream_status.as_u16());
    let out_status = if pass_status_ok { upstream_status } else { StatusCode::OK };

    let mut axum_headers = HeaderMap::new();
    axum_headers.insert("x-bare-status", HeaderValue::from_str(&upstream_status.as_u16().to_string()).unwrap());
    axum_headers.insert("x-bare-status-text", HeaderValue::from_str(upstream_status.canonical_reason().unwrap_or("")).unwrap());
    let hdrs_json = Value::Object(resp_headers_json.clone()).to_string();
    if let Ok(hv) = HeaderValue::from_str(&hdrs_json) {
        axum_headers.insert("x-bare-headers", hv);
    }
    // Pass-through specific headers
    for name in &pass_h_list {
        let key_lower = name.to_ascii_lowercase();
        if let Some(val) = resp_headers_json.get(&key_lower) {
            if let Some(s) = val.as_str() {
                if let (Ok(n), Ok(v)) = (HeaderName::from_str(name), HeaderValue::from_str(s)) {
                    axum_headers.insert(n, v);
                }
            }
        }
    }
    // Essential content-type passthrough for body decoding on client (bare client handles decoding)
    let stream = resp.bytes_stream().map_err(|e| std::io::Error::other(e));
    let body = Body::from_stream(stream);
    cors_response(out_status, axum_headers, body)
}

fn cors_response(status: StatusCode, mut headers: HeaderMap, body: Body) -> Response {
    headers.insert("access-control-allow-origin", HeaderValue::from_static("*"));
    headers.insert("access-control-allow-methods", HeaderValue::from_static("GET,POST,PUT,DELETE,OPTIONS,PATCH"));
    headers.insert("access-control-allow-headers", HeaderValue::from_static("*"));
    headers.insert("access-control-expose-headers", HeaderValue::from_static("*"));
    headers.insert("access-control-max-age", HeaderValue::from_static("86400"));
    let mut resp = Response::builder().status(status).body(body).unwrap();
    *resp.headers_mut() = headers;
    resp
}

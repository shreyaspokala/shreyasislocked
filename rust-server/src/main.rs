mod bare;

use axum::{
    body::Body,
    extract::Request,
    http::{header, StatusCode, Uri},
    response::{IntoResponse, Response},
    routing::any,
    Router,
};
use std::{env, net::SocketAddr, path::PathBuf, sync::Arc};
use tokio::fs;
use tower_http::trace::TraceLayer;

#[derive(Clone)]
pub struct AppState {
    pub root: Arc<PathBuf>,
    pub http: reqwest::Client,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::try_from_default_env()
            .unwrap_or_else(|_| "info,tower_http=info".into()))
        .init();

    let root_candidate = PathBuf::from("dist");
    let root = if root_candidate.exists() { root_candidate } else { PathBuf::from("public") };
    let root = fs::canonicalize(&root).await?;
    let port: u16 = env::var("PORT").ok().and_then(|s| s.parse().ok()).unwrap_or(3000);

    let client = reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::none())
        .danger_accept_invalid_certs(false)
        .build()?;

    let state = AppState { root: Arc::new(root.clone()), http: client };

    let app = Router::new()
        .route("/bare/", any(bare::index))
        .route("/bare/v3/", any(bare::v3))
        .fallback(any(static_fallback))
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let addr: SocketAddr = ([0, 0, 0, 0], port).into();
    tracing::info!("Serving {} on http://localhost:{}", root.display(), port);
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;
    Ok(())
}

const MIME: &[(&str, &str)] = &[
    (".html", "text/html; charset=utf-8"),
    (".js", "text/javascript; charset=utf-8"),
    (".mjs", "text/javascript; charset=utf-8"),
    (".css", "text/css; charset=utf-8"),
    (".json", "application/json; charset=utf-8"),
    (".wasm", "application/wasm"),
    (".svg", "image/svg+xml"),
    (".png", "image/png"),
    (".jpg", "image/jpeg"),
    (".jpeg", "image/jpeg"),
    (".gif", "image/gif"),
    (".webp", "image/webp"),
    (".ico", "image/x-icon"),
    (".map", "application/json"),
    (".woff", "font/woff"),
    (".woff2", "font/woff2"),
    (".ttf", "font/ttf"),
    (".mp3", "audio/mpeg"),
    (".mp4", "video/mp4"),
    (".webm", "video/webm"),
];

fn mime_for(path: &std::path::Path) -> &'static str {
    let name = path.file_name().and_then(|s| s.to_str()).unwrap_or("");
    for (ext, ct) in MIME {
        if name.ends_with(ext) { return ct; }
    }
    "application/octet-stream"
}

async fn static_fallback(
    axum::extract::State(state): axum::extract::State<AppState>,
    uri: Uri,
) -> Response {
    let raw = percent_encoding::percent_decode_str(uri.path()).decode_utf8_lossy().to_string();
    let rel = raw.trim_start_matches('/');
    let mut candidate = state.root.join(rel);
    if !candidate.starts_with(state.root.as_path()) {
        return not_found(&state).await;
    }
    if candidate.is_dir() {
        candidate = candidate.join("index.html");
    }
    if !candidate.exists() {
        let with_html = state.root.join(format!("{}.html", rel));
        if with_html.exists() && with_html.starts_with(state.root.as_path()) {
            candidate = with_html;
        } else if rel.is_empty() {
            candidate = state.root.join("index.html");
        } else {
            return not_found(&state).await;
        }
    }
    match fs::read(&candidate).await {
        Ok(bytes) => Response::builder()
            .status(StatusCode::OK)
            .header(header::CONTENT_TYPE, mime_for(&candidate))
            .header(header::CACHE_CONTROL, "no-cache")
            .body(Body::from(bytes))
            .unwrap(),
        Err(_) => not_found(&state).await,
    }
}

async fn not_found(state: &AppState) -> Response {
    let p = state.root.join("404.html");
    if let Ok(bytes) = fs::read(&p).await {
        return Response::builder()
            .status(StatusCode::NOT_FOUND)
            .header(header::CONTENT_TYPE, "text/html; charset=utf-8")
            .body(Body::from(bytes))
            .unwrap();
    }
    (StatusCode::NOT_FOUND, "404").into_response()
}

#[allow(dead_code)]
pub async fn _unused(_: Request) {}

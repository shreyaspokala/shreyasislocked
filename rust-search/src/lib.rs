use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

#[derive(Serialize, Deserialize, Clone)]
pub struct Item {
    pub name: String,
    pub url: String,
    #[serde(default)]
    pub image: String,
    #[serde(rename = "usesProxy", default)]
    pub uses_proxy: bool,
}

#[derive(Serialize)]
pub struct Scored {
    pub idx: usize,
    pub score: i32,
}

#[wasm_bindgen]
pub struct Index {
    items: Vec<Item>,
    lower: Vec<String>,
}

#[wasm_bindgen]
impl Index {
    #[wasm_bindgen(constructor)]
    pub fn new(json: JsValue) -> Result<Index, JsValue> {
        let items: Vec<Item> = serde_wasm_bindgen::from_value(json)?;
        let lower = items.iter().map(|i| i.name.to_lowercase()).collect();
        Ok(Index { items, lower })
    }

    #[wasm_bindgen]
    pub fn len(&self) -> usize {
        self.items.len()
    }

    #[wasm_bindgen]
    pub fn all(&self) -> Result<JsValue, JsValue> {
        serde_wasm_bindgen::to_value(&self.items).map_err(Into::into)
    }

    #[wasm_bindgen]
    pub fn search(&self, query: &str, limit: usize) -> Result<JsValue, JsValue> {
        let q = query.trim().to_lowercase();
        if q.is_empty() {
            return serde_wasm_bindgen::to_value(&self.items).map_err(Into::into);
        }
        let mut scored: Vec<(i32, usize)> = self
            .lower
            .iter()
            .enumerate()
            .filter_map(|(i, name)| fuzzy_score(name, &q).map(|s| (s, i)))
            .collect();
        scored.sort_by(|a, b| b.0.cmp(&a.0).then(a.1.cmp(&b.1)));
        scored.truncate(limit);
        let out: Vec<&Item> = scored.iter().map(|(_, i)| &self.items[*i]).collect();
        serde_wasm_bindgen::to_value(&out).map_err(Into::into)
    }
}

fn fuzzy_score(haystack: &str, needle: &str) -> Option<i32> {
    if haystack.contains(needle) {
        let bonus = if haystack.starts_with(needle) { 100 } else { 50 };
        return Some(bonus + 1000 - haystack.len() as i32);
    }
    let hb = haystack.as_bytes();
    let nb = needle.as_bytes();
    let mut hi = 0usize;
    let mut ni = 0usize;
    let mut score = 0i32;
    let mut streak = 0i32;
    while hi < hb.len() && ni < nb.len() {
        if hb[hi] == nb[ni] {
            streak += 1;
            score += 2 + streak * 2;
            ni += 1;
        } else {
            streak = 0;
        }
        hi += 1;
    }
    if ni == nb.len() { Some(score) } else { None }
}

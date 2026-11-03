import json
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

API = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = "study-atelier-exhibit-art/0.1 (https://github.com/kamil-nawrot/study-atelier)"
MAX_WIDTH = 3840


def _get(url: str) -> bytes:
    for attempt in range(6):
        request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        try:
            with urllib.request.urlopen(request, timeout=120) as response:
                return response.read()
        except urllib.error.HTTPError as error:
            if error.code != 429:
                raise
            time.sleep(int(error.headers.get("retry-after", "5")) + 2 + attempt * 3)
    raise RuntimeError(f"rate limited: {url}")


def file_url(commons_file: str, max_width: int = MAX_WIDTH) -> str:
    query = urllib.parse.urlencode(
        {
            "action": "query",
            "format": "json",
            "titles": f"File:{commons_file}",
            "prop": "imageinfo",
            "iiprop": "url|size",
            "iiurlwidth": max_width,
        }
    )
    page = next(iter(json.loads(_get(f"{API}?{query}"))["query"]["pages"].values()))
    if "imageinfo" not in page:
        raise FileNotFoundError(commons_file)
    info = page["imageinfo"][0]
    url = info["url"] if info["width"] <= max_width else info["thumburl"]
    return url.replace("thumb.wikimedia.org", "upload.wikimedia.org").split("?")[0]


def download(commons_file: str, target: Path, max_width: int = MAX_WIDTH) -> Path:
    if target.exists():
        return target
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(_get(file_url(commons_file, max_width)))
    return target

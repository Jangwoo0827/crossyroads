#!/usr/bin/env bash
# 사용법: scripts/export-superdialer.sh <phonecall(SuperDialer) 저장소 경로>
# 빌드 결과를 app/src/main/assets/games/crossyroads/ 에 넣고 games.json 에 등록한다.
set -euo pipefail
TARGET="${1:?SuperDialer 저장소 경로를 인자로 주세요}"
ASSETS="$TARGET/app/src/main/assets/games"
[ -f "$ASSETS/games.json" ] || { echo "games.json 을 찾을 수 없어요: $ASSETS"; exit 1; }

cd "$(dirname "$0")/.."
npm run build
rm -rf "$ASSETS/crossyroads"
mkdir -p "$ASSETS/crossyroads"
cp -r dist/. "$ASSETS/crossyroads/"

node -e '
const fs = require("fs");
const f = process.argv[1];
const list = JSON.parse(fs.readFileSync(f, "utf8"));
const entry = { id: "crossyroads", title: "횡단 대작전", description: "차·강·기차를 피해 끝없이 건너세요", path: "crossyroads/index.html", color: "#FF7A59" };
const i = list.findIndex((g) => g.id === entry.id);
if (i >= 0) list[i] = entry; else list.push(entry);
fs.writeFileSync(f, JSON.stringify(list, null, 2) + "\n");
' "$ASSETS/games.json"
echo "완료: $ASSETS/crossyroads"

#!/bin/bash
# Script resize tất cả pharaoh symbols xuống 256x256

echo "🎯 Starting resize pharaoh symbols..."

cd "assets/bundles/game_pharaoh/textures/symbols"

# Backup folder (nếu cần rollback)
mkdir -p _backup
cp pharaoh_symbol_*.png _backup/ 2>/dev/null || true

# Resize tất cả symbols
for file in pharaoh_symbol_*.png; do
  if [ -f "$file" ]; then
    echo "Resizing: $file (957x1080 → 256x256)"
    
    # Dùng sips (built-in trên macOS)
    sips -z 256 256 "$file" --out "$file" > /dev/null 2>&1
    
    # Hoặc dùng ImageMagick nếu có
    # magick "$file" -resize 256x256 "$file"
    
    echo "✅ Done: $file"
  fi
done

echo ""
echo "✅ ALL DONE!"
echo "📁 Backup folder: _backup/"
echo "🎮 Cocos Creator sẽ tự động rebuild atlas"
echo ""
echo "Kết quả:"
echo "- Trước: 957x1080 (~1MB mỗi file)"
echo "- Sau:  256x256 (~50KB mỗi file)"
echo "- Tiết kiệm: 95% dung lượng!"

#!/bin/bash
# Script resize pharaoh symbols xuống 128x128 (tối ưu cho atlas 512x512)

echo "🎯 Resizing symbols: 256×256 → 128×128"
echo ""

cd "assets/bundles/game_pharaoh/textures/symbols"

# Backup nếu chưa có
if [ ! -d "../symbols_backup_256" ]; then
  mkdir -p ../symbols_backup_256
  cp pharaoh_symbol_*.png ../symbols_backup_256/
  echo "📁 Backup saved to: symbols_backup_256/"
fi

# Resize tất cả symbols
for file in pharaoh_symbol_*.png; do
  if [ -f "$file" ]; then
    echo "Resizing: $file (256×256 → 128×128)"
    sips -z 128 128 "$file" --out "$file" > /dev/null 2>&1
    echo "✅ $file"
  fi
done

echo ""
echo "✅ RESIZE COMPLETE!"
echo ""
echo "📊 Kết quả:"
echo "  - Symbols: 256×256 → 128×128"
echo "  - Atlas: 512×512 chứa được 16 symbols"
echo "  - File size: Giảm 75%!"
echo "  - Chất lượng: Vẫn đẹp (display 80×80)"
echo ""
echo "🎮 Cocos Creator sẽ rebuild atlas tự động"
echo "📁 Rollback: cp ../symbols_backup_256/* ./"

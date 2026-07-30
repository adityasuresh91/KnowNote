#!/bin/bash

# KnowNote Video Support Verification Script
# Checks that all components are properly installed and configured

echo "🎬 KnowNote Video Support Verification"
echo "======================================"
echo ""

PASS=0
FAIL=0

# 1. Check System Dependencies
echo "1. System Dependencies"
echo "----------------------"

if command -v ffmpeg &> /dev/null; then
  echo "✓ FFmpeg installed"
  ((PASS++))
else
  echo "✗ FFmpeg not found"
  ((FAIL++))
fi

if command -v ffprobe &> /dev/null; then
  echo "✓ FFprobe installed"
  ((PASS++))
else
  echo "✗ FFprobe not found"
  ((FAIL++))
fi

echo ""

# 2. Check Project Structure
echo "2. Project Files"
echo "----------------"

FILES=(
  "src/main/services/loaders/VideoLoader.ts"
  "src/main/services/FileParserService.ts"
  "VIDEO_SUPPORT.md"
  "CLAUDE_VIDEO_SETUP.md"
  ".claude/video-config.json"
  "examples/video-processing-example.ts"
  "src/main/services/loaders/__tests__/VideoLoader.test.ts"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "✓ $file"
    ((PASS++))
  else
    echo "✗ Missing: $file"
    ((FAIL++))
  fi
done

echo ""

# 3. Check Configuration
echo "3. Configuration"
echo "----------------"

if [ -f ".claude/video-config.json" ]; then
  echo "✓ Configuration file exists"
  ((PASS++))
else
  echo "✗ Configuration file missing"
  ((FAIL++))
fi

echo ""

# 4. Summary
echo "======================================"
echo "Results: $PASS passed, $FAIL failed"
echo "======================================"

if [ $FAIL -eq 0 ]; then
  echo ""
  echo "✅ All checks passed!"
  echo ""
  echo "Next steps:"
  echo "1. pnpm install"
  echo "2. pnpm run dev"
  echo "3. Add a video file to KnowNote"
  exit 0
else
  echo ""
  echo "❌ Some checks failed"
  exit 1
fi

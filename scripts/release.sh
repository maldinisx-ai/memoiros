#!/bin/bash
# MemoirOS 发布脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo -e "${RED}错误: 请在项目根目录运行此脚本${NC}"
    exit 1
fi

# 获取版本号
VERSION=$(node -p "require('./package.json').version")
echo -e "${GREEN}准备发布版本: ${VERSION}${NC}"

# 运行测试
echo -e "${YELLOW}运行测试...${NC}"
pnpm test

# 类型检查
echo -e "${YELLOW}类型检查...${NC}"
pnpm run type-check

# 构建
echo -e "${YELLOW}构建项目...${NC}"
pnpm build

# 创建 Git 标签
echo -e "${YELLOW}创建 Git 标签...${NC}"
git tag -a "v${VERSION}" -m "Release v${VERSION}"
git push origin "v${VERSION}"

# 发布到 npm (取消注释以实际发布)
# echo -e "${YELLOW}发布到 npm...${NC}"
# npm publish --access public

echo -e "${GREEN}发布完成！${NC}"
echo -e "版本: ${VERSION}"
echo -e "标签: v${VERSION}"

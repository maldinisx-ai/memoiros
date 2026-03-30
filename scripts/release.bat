@echo off
REM MemoirOS 发布脚本 (Windows)

setlocal enabledelayedexpansion

REM 检查是否在正确的目录
if not exist "package.json" (
    echo 错误: 请在项目根目录运行此脚本
    exit /b 1
)

REM 获取版本号
for /f "tokens=*" %%i in ('node -p "require(''./package.json'').version"') do set VERSION=%%i
echo 准备发布版本: %VERSION%

REM 运行测试
echo 运行测试...
call pnpm test
if errorlevel 1 (
    echo 测试失败，发布中止
    exit /b 1
)

REM 类型检查
echo 类型检查...
call pnpm run type-check
if errorlevel 1 (
    echo 类型检查失败，发布中止
    exit /b 1
)

REM 构建
echo 构建项目...
call pnpm build
if errorlevel 1 (
    echo 构建失败，发布中止
    exit /b 1
)

REM 创建 Git 标签
echo 创建 Git 标签...
git tag -a "v%VERSION%" -m "Release v%VERSION%"
git push origin "v%VERSION%"

REM 发布到 npm (取消注释以实际发布)
REM echo 发布到 npm...
REM npm publish --access public

echo 发布完成！
echo 版本: %VERSION%
echo 标签: v%VERSION%

endlocal

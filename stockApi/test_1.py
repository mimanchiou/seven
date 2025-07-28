import time
import yfinance as yf
from yfinance.exceptions import YFRateLimitError


def get_stock_info(symbol, max_retries=5, initial_delay=5):
    """
    获取股票信息，带指数退避重试机制

    参数:
        symbol: 股票代码
        max_retries: 最大重试次数
        initial_delay: 初始延迟时间（秒）
    """
    for attempt in range(max_retries):
        try:
            stock = yf.Ticker(symbol)
            # 先尝试获取简单数据，判断连接是否正常
            info = stock.info
            print(f"成功获取 {symbol} 的信息")
            return info
        except YFRateLimitError:
            if attempt < max_retries - 1:
                # 指数退避：每次重试延迟翻倍
                delay = initial_delay * (2 ** attempt)
                print(f"请求被限制，将在 {delay} 秒后重试（第 {attempt + 2} 次尝试）")
                time.sleep(delay)
            else:
                print(f"达到最大重试次数，无法获取 {symbol} 的信息")
                return None
        except Exception as e:
            print(f"获取 {symbol} 信息时发生其他错误: {str(e)}")
            return None


# 使用示例
if __name__ == "__main__":
    # 增加初始延迟，避免一开始就触发限制
    time.sleep(3)
    msft_info = get_stock_info("MSFT")

    if msft_info:
        # 打印部分关键信息
        print("\n关键信息摘要:")
        key_fields = ['longName', 'currentPrice', 'previousClose', 'marketCap']
        for field in key_fields:
            if field in msft_info:
                print(f"{field}: {msft_info[field]}")

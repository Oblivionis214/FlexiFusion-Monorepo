// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

library StableSwapLibrary {
    // 最小流动性常量
    uint256 public constant MINIMUM_LIQUIDITY = 1000;
    
    // 精度常量，用于处理小数计算
    uint256 private constant PRECISION = 1e18;

    // 计算不变量 k = x³y + y³x
    function calculateK(uint256 x, uint256 y) public pure returns (uint256) {
        // 使用高精度计算避免溢出
        uint256 x3y = (((x * x) / PRECISION) * x * y) / PRECISION;
        uint256 y3x = (((y * y) / PRECISION) * y * x) / PRECISION;
        return x3y + y3x;
    }

    // 计算给定输入金额的输出金额
    // 使用 x³y + y³x = k 公式
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) public pure returns (uint256 amountOut) {
        require(amountIn > 0, "StableSwapLibrary: INSUFFICIENT_INPUT_AMOUNT");
        require(
            reserveIn > 0 && reserveOut > 0,
            "StableSwapLibrary: INSUFFICIENT_LIQUIDITY"
        );

        // 计算当前的不变量 k
        uint256 k = calculateK(reserveIn, reserveOut);
        
        // 应用手续费 (0.3%)
        uint256 amountInWithFee = (amountIn * 997) / 1000;
        uint256 newReserveIn = reserveIn + amountInWithFee;
        
        // 使用二分查找法找到满足 x³y + y³x = k 的 y 值
        uint256 left = 1;
        uint256 right = reserveOut;
        uint256 newReserveOut;
        
        for (uint256 i = 0; i < 255; i++) {
            newReserveOut = (left + right) / 2;
            uint256 newK = calculateK(newReserveIn, newReserveOut);
            
            if (newK < k) {
                right = newReserveOut;
            } else if (newK > k) {
                left = newReserveOut;
            } else {
                break;
            }
            
            if (left >= right - 1) {
                break;
            }
        }
        
        require(newReserveOut < reserveOut, "StableSwapLibrary: INVALID_RESULT");
        amountOut = reserveOut - newReserveOut;
    }

    // 计算需要多少输入金额才能得到指定的输出金额
    function getAmountIn(
        uint256 amountOut,
        uint256 reserveIn,
        uint256 reserveOut
    ) public pure returns (uint256 amountIn) {
        require(amountOut > 0, "StableSwapLibrary: INSUFFICIENT_OUTPUT_AMOUNT");
        require(
            reserveIn > 0 && reserveOut > 0,
            "StableSwapLibrary: INSUFFICIENT_LIQUIDITY"
        );

        uint256 k = calculateK(reserveIn, reserveOut);
        uint256 newReserveOut = reserveOut - amountOut;
        
        // 使用二分查找法找到满足 x³y + y³x = k 的 x 值
        uint256 left = reserveIn;
        uint256 right = reserveIn * 2;  // 估计上限
        uint256 newReserveIn;
        
        for (uint256 i = 0; i < 255; i++) {
            newReserveIn = (left + right) / 2;
            uint256 newK = calculateK(newReserveIn, newReserveOut);
            
            if (newK < k) {
                left = newReserveIn;
            } else if (newK > k) {
                right = newReserveIn;
            } else {
                break;
            }
            
            if (left >= right - 1) {
                break;
            }
        }
        
        // 计算所需输入金额（包含手续费）
        amountIn = ((newReserveIn - reserveIn) * 1000) / 997 + 1;
    }

    // 计算添加流动性时的最优数量
    function quote(
        uint256 amountA,
        uint256 reserveA,
        uint256 reserveB
    ) public pure returns (uint256 amountB) {
        require(amountA > 0, "StableSwapLibrary: INSUFFICIENT_AMOUNT");
        require(
            reserveA > 0 && reserveB > 0,
            "StableSwapLibrary: INSUFFICIENT_LIQUIDITY"
        );
        
        // 在稳定币对中，比例应该接近 1:1
        amountB = (amountA * reserveB) / reserveA;
    }

    // 计算流动性代币的数量
    function calculateLiquidity(
        uint256 amount0,
        uint256 amount1,
        uint256 reserve0,
        uint256 reserve1,
        uint256 totalSupply
    ) public pure returns (uint256 liquidity) {
        if (totalSupply == 0) {
            // 首次添加流动性
            // 使用几何平均数作为初始流动性
            liquidity = sqrt((amount0 * amount1)) - MINIMUM_LIQUIDITY;
        } else {
            // 非首次添加流动性
            // 使用较小的比例来确保公平性
            liquidity = min(
                (amount0 * totalSupply) / reserve0,
                (amount1 * totalSupply) / reserve1
            );
        }
    }

    // 计算移除流动性时获得的代币数量
    function calculateRemoveLiquidity(
        uint256 liquidity,
        uint256 totalSupply,
        uint256 reserve0,
        uint256 reserve1
    ) public pure returns (uint256 amount0, uint256 amount1) {
        require(liquidity > 0, "StableSwapLibrary: INSUFFICIENT_LIQUIDITY");
        amount0 = (liquidity * reserve0) / totalSupply;
        amount1 = (liquidity * reserve1) / totalSupply;
    }

    // 辅助函数：计算平方根
    function sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }

    // 辅助函数：返回最小值
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
} 
import { LogLevel } from "@sentio/sdk";
import { EthContext } from "@sentio/sdk/eth";
import { PENDLE_POOL_ADDRESSES } from "../consts.js";

/**
 *
 * @param amountTokenHolding amount of Ez Eth user holds during the period
 * @param holdingPeriod amount of time user holds the Ez Eth
 * @returns EZ point & Eigen Layer point
 *
 * @dev to be modified by underlying team
 */
function calcPointsFromHolding(
  amountTokenHolding: bigint,
  holdingPeriod: bigint
): [bigint, bigint] {
  return [
    (amountTokenHolding * holdingPeriod) / 3600n,
    (amountTokenHolding * holdingPeriod) / 3600n,
  ];
}

export async function updatePoints(
  ctx: EthContext,
  label: string,
  account: string,
  amountTokenHolding: bigint,
  holdingPeriod: bigint,
  updatedAt: number
) {
  const [ezPoint, elPoint] = calcPointsFromHolding(
    amountTokenHolding,
    holdingPeriod
  );

  if (label == "YT") {
    const ezPointTreasuryFee = calcTreasuryFee(ezPoint);
    const elPointTreasuryFee = calcTreasuryFee(elPoint);
    increasePoint(
      ctx,
      label,
      account,
      amountTokenHolding,
      holdingPeriod,
      ezPoint - ezPointTreasuryFee,
      elPoint - elPointTreasuryFee,
      updatedAt
    );
    increasePoint(
      ctx,
      label,
      PENDLE_POOL_ADDRESSES.TREASURY,
      0n,
      holdingPeriod,
      ezPointTreasuryFee,
      elPointTreasuryFee,
      updatedAt
    );
  } else {
    increasePoint(
      ctx,
      label,
      account,
      amountTokenHolding,
      holdingPeriod,
      ezPoint,
      elPoint,
      updatedAt
    );
  }
}

function increasePoint(
  ctx: EthContext,
  label: string,
  account: string,
  amountTokenHolding: bigint,
  holdingPeriod: bigint,
  ezPoint: bigint,
  elPoint: bigint,
  updatedAt: number
) {
  ctx.eventLogger.emit("point_increase", {
    label,
    account: account.toLowerCase(),
    amountTokenHolding: amountTokenHolding.scaleDown(18),
    holdingPeriod,
    ezPoint,
    elPoint,
    updatedAt,
    severity: LogLevel.INFO,
  });
}

function calcTreasuryFee(amount: bigint): bigint {
  return (amount * 3n) / 100n;
}

/**
 * @module eth1
 */

import {AbortSignal} from "abort-controller";
import {IBatchDepositEvents, IEth1Provider, IEth1StreamParams} from "./interface";
import {IDepositEvent, IEth1BlockHeader} from "./types";
import {groupDepositEventsByBlock} from "./utils/groupDepositEventsByBlock";
import {optimizeNextBlockDiffForGenesis} from "./utils/optimizeNextBlockDiffForGenesis";
import {sleep} from "../util/sleep";

/**
 * Phase 1 of genesis building.
 * Not enough validators, only stream deposits
 * @param signal Abort stream returning after a while loop cycle. Aborts internal sleep
 */
export async function* getDepositsStream(
  fromBlock: number,
  provider: IEth1Provider,
  params: IEth1StreamParams,
  signal?: AbortSignal
): AsyncGenerator<IBatchDepositEvents> {
  fromBlock = Math.max(fromBlock, provider.deployBlock);

  while (true) {
    const remoteFollowBlock = await getRemoteFollowBlock(provider, params);
    const toBlock = Math.min(remoteFollowBlock, fromBlock + params.MAX_BLOCKS_PER_POLL);
    const logs = await provider.getDepositEvents(fromBlock, toBlock);
    for (const [blockNumber, depositEvents] of groupDepositEventsByBlock(logs)) {
      yield {blockNumber, depositEvents};
    }

    fromBlock = toBlock;

    // If reached head, sleep for an eth1 block. Throws if signal is aborted
    await sleep(toBlock >= remoteFollowBlock ? params.SECONDS_PER_ETH1_BLOCK * 1000 : 10, signal);
  }
}

/**
 * Phase 2 of genesis building.
 * There are enough validators, stream deposits and blocks
 * @param signal Abort stream returning after a while loop cycle. Aborts internal sleep
 */
export async function* getDepositsAndBlockStreamForGenesis(
  fromBlock: number,
  provider: IEth1Provider,
  params: IEth1StreamParams,
  signal?: AbortSignal
): AsyncGenerator<[IDepositEvent[], IEth1BlockHeader]> {
  fromBlock = Math.max(fromBlock, provider.deployBlock);
  fromBlock = Math.min(fromBlock, await getRemoteFollowBlock(provider, params));
  let toBlock = fromBlock; // First, fetch only the first block

  while (true) {
    const [logs, block] = await Promise.all([
      provider.getDepositEvents(fromBlock, toBlock),
      provider.getBlock(toBlock),
    ]);
    yield [logs, block];

    const remoteFollowBlock = await getRemoteFollowBlock(provider, params);
    const nextBlockDiff = optimizeNextBlockDiffForGenesis(block, params);
    fromBlock = toBlock;
    toBlock = Math.min(remoteFollowBlock, fromBlock + Math.min(nextBlockDiff, params.MAX_BLOCKS_PER_POLL));

    // If reached head, sleep for an eth1 block. Throws if signal is aborted
    await sleep(toBlock >= remoteFollowBlock ? params.SECONDS_PER_ETH1_BLOCK * 1000 : 10, signal);
  }
}

async function getRemoteFollowBlock(provider: IEth1Provider, params: IEth1StreamParams): Promise<number> {
  const remoteHighestBlock = await provider.getBlockNumber();
  return Math.max(remoteHighestBlock - params.ETH1_FOLLOW_DISTANCE, 0);
}

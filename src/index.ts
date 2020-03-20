import {generateParticipants, BlockChain, Pool, Metrics} from './entities';
import {auction, taxCollection, blockPayout} from './actions';
import * as params from './parameters';

const participants = [
  Pool.participant,
  ...generateParticipants(4), //params.PARTICIPANT.COUNT),
];
console.log(participants);

const metrics: Metrics = {
  tradeRoundTime: 0,
  tradeRoundCount: 0,
  tradeCount: 0,
  rewardCount: 0,
};

const blockInterval = setInterval(() => {
  blockPayout(BlockChain.reward, Pool.chunks, participants, metrics);
}, params.BLOCK.INTERVAL * 1000);

let tradeTimeout: NodeJS.Timeout;

const tradeIntervalFn = async () => {
  const start = Date.now();

  participants.forEach(taxCollection);

  await participants.reduce(async (prevAuction, participant) => {
    await prevAuction;
    return auction(participant, participants, metrics);
  }, auction(participants[0], participants, metrics));

  const end = Date.now();
  metrics.tradeRoundTime += end - start;
  metrics.tradeRoundCount += 1;

  tradeTimeout = setTimeout(tradeIntervalFn, params.TRADE.INTERVAL * 1000);
};

tradeIntervalFn();

setTimeout(() => {
  clearInterval(blockInterval);
  clearTimeout(tradeTimeout);

  console.log(
    JSON.stringify(
      participants.map((participant) => {
        const {id, balance, history, ownedChunks} = participant;
        return `${id} balance: ${history[0].amount} -> ${balance} chunks: ${history[0].ownedChunks} -> ${ownedChunks}`;
      }),
      null,
      4,
    ),
  );

  console.log(metrics);
  console.log(
    'average trade time',
    metrics.tradeRoundTime / metrics.tradeRoundCount,
  );
}, params.BLOCK.ROUNDS * 1000);

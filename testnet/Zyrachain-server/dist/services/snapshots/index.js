"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildEcosystemLeaderboards = exports.buildAssetsPools = exports.buildCexFlows = exports.buildTopWallets = exports.buildHomePulse = exports.buildLatestTrades = exports.buildLatestTransactions = exports.buildLatestOps = exports.buildLatestBlocks = exports.buildHomeHero = void 0;
exports.runAllSnapshotBuilders = runAllSnapshotBuilders;
var buildHomeHero_1 = require("./buildHomeHero");
Object.defineProperty(exports, "buildHomeHero", { enumerable: true, get: function () { return buildHomeHero_1.buildHomeHero; } });
var buildLatestBlocks_1 = require("./buildLatestBlocks");
Object.defineProperty(exports, "buildLatestBlocks", { enumerable: true, get: function () { return buildLatestBlocks_1.buildLatestBlocks; } });
var buildLatestOps_1 = require("./buildLatestOps");
Object.defineProperty(exports, "buildLatestOps", { enumerable: true, get: function () { return buildLatestOps_1.buildLatestOps; } });
var buildLatestTransactions_1 = require("./buildLatestTransactions");
Object.defineProperty(exports, "buildLatestTransactions", { enumerable: true, get: function () { return buildLatestTransactions_1.buildLatestTransactions; } });
var buildLatestTrades_1 = require("./buildLatestTrades");
Object.defineProperty(exports, "buildLatestTrades", { enumerable: true, get: function () { return buildLatestTrades_1.buildLatestTrades; } });
var buildHomePulse_1 = require("./buildHomePulse");
Object.defineProperty(exports, "buildHomePulse", { enumerable: true, get: function () { return buildHomePulse_1.buildHomePulse; } });
var buildTopWallets_1 = require("./buildTopWallets");
Object.defineProperty(exports, "buildTopWallets", { enumerable: true, get: function () { return buildTopWallets_1.buildTopWallets; } });
var buildCexFlows_1 = require("./buildCexFlows");
Object.defineProperty(exports, "buildCexFlows", { enumerable: true, get: function () { return buildCexFlows_1.buildCexFlows; } });
var buildAssetsPools_1 = require("./buildAssetsPools");
Object.defineProperty(exports, "buildAssetsPools", { enumerable: true, get: function () { return buildAssetsPools_1.buildAssetsPools; } });
var buildEcosystemLeaderboards_1 = require("./buildEcosystemLeaderboards");
Object.defineProperty(exports, "buildEcosystemLeaderboards", { enumerable: true, get: function () { return buildEcosystemLeaderboards_1.buildEcosystemLeaderboards; } });
const buildHomeHero_2 = require("./buildHomeHero");
const buildLatestBlocks_2 = require("./buildLatestBlocks");
const buildLatestOps_2 = require("./buildLatestOps");
const buildLatestTransactions_2 = require("./buildLatestTransactions");
const buildLatestTrades_2 = require("./buildLatestTrades");
const buildHomePulse_2 = require("./buildHomePulse");
const buildTopWallets_2 = require("./buildTopWallets");
const buildCexFlows_2 = require("./buildCexFlows");
const buildAssetsPools_2 = require("./buildAssetsPools");
const buildEcosystemLeaderboards_2 = require("./buildEcosystemLeaderboards");
async function runAllSnapshotBuilders() {
    await (0, buildHomeHero_2.buildHomeHero)();
    await Promise.all([
        (0, buildLatestBlocks_2.buildLatestBlocks)(),
        (0, buildLatestTransactions_2.buildLatestTransactions)(),
        (0, buildLatestOps_2.buildLatestOps)(),
        (0, buildLatestTrades_2.buildLatestTrades)(),
        (0, buildHomePulse_2.buildHomePulse)(),
        (0, buildTopWallets_2.buildTopWallets)(),
        (0, buildCexFlows_2.buildCexFlows)(),
        (0, buildAssetsPools_2.buildAssetsPools)(),
        (0, buildEcosystemLeaderboards_2.buildEcosystemLeaderboards)(),
    ]);
}
//# sourceMappingURL=index.js.map
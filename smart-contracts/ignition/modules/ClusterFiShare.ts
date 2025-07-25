import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ClusterFiShareModule = buildModule("ClusterFiShareModule", (m) => {
  const clusterFiShare = m.contract("ClusterFiShare");

  return { clusterFiShare };
});

export default ClusterFiShareModule;
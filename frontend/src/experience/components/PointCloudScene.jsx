import RobotSystem from './RobotSystem';
import FiberSystem from './FiberSystem';
import CardSystem from './CardSystem';
import LogoSystem from './LogoSystem';
import DiamondSystem from './DiamondSystem';
import GalaxySystem from './GalaxySystem';

export default function PointCloudScene() {
  return (
    <>
      <RobotSystem />
      <FiberSystem />
      <CardSystem />
      <LogoSystem />
      <DiamondSystem />
      <GalaxySystem />
    </>
  );
}
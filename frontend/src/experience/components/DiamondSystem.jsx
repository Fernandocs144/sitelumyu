import { useFrame } from '@react-three/fiber';
import { useExperience } from '../hooks/useExperience';

export default function DiamondSystem() {

    const { engine } = useExperience();

    useFrame(() => {

        if (!engine?.diamondSystem) return;

        engine.diamondSystem.update();

    });

    return null;

}
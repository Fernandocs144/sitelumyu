import { useFrame } from '@react-three/fiber';
import { useExperience } from '../hooks/useExperience';

export default function GalaxySystem() {

    const { engine } = useExperience();

    useFrame(() => {

        if (!engine?.galaxySystem) return;

        engine.galaxySystem.update();

    });

    return null;

}
import { useFrame } from '@react-three/fiber';
import { useExperience } from '../hooks/useExperience';

export default function FiberSystem() {

    const { engine } = useExperience();

    useFrame(() => {

        if (!engine?.fiberSystem) return;

        engine.fiberSystem.update();

    });

    return null;

}
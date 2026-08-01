import { useFrame } from '@react-three/fiber';
import { useExperience } from '../hooks/useExperience';

export default function CardSystem() {

    const { engine } = useExperience();

    useFrame(() => {

        if (!engine?.cardSystem) return;

        engine.cardSystem.update();

    });

    return null;

}
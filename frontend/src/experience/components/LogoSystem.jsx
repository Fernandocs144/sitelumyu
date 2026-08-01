import { useFrame } from '@react-three/fiber';
import { useExperience } from '../hooks/useExperience';

export default function LogoSystem() {

    const { engine } = useExperience();

    useFrame(() => {

        if (!engine?.logoSystem) return;

        engine.logoSystem.update();

    });

    return null;

}
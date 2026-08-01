import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useExperience } from '../hooks/useExperience';

export default function RobotSystem() {

    const { engine } = useExperience();

    const initialized = useRef(false);

    useEffect(() => {

    if (!engine) return;

    if (initialized.current) return;

    if (!engine.sceneManager.isAttached) return;

    initialized.current = true;

    async function init() {

        const system = engine.createRobotSystem();

        await system.create();

    }

    init();

}, [engine]);

    useFrame((state, delta) => {

        if (!engine?.robotSystem) return;

        engine.robotSystem.update(delta);

    });

    return null;

}
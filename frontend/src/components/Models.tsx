'use client';
import { useGLTF  } from '@react-three/drei';
import { useRef } from 'react';
import { Group } from 'three';

// Note Group: A container to control many 3D objects as one single object.

export const TechGuyModel = () =>{
    const { scene } = useGLTF("/models/tech_guy.glb") as { scene: Group };
    const  modelRef = useRef<Group>(null);

    return  <primitive ref={modelRef} object={scene} scale={[3,3,3]} position={[0, 0, 0]} />
}

export const PageNotFoundModel = ()=>{
    const { scene } = useGLTF("/models/page_not_found.glb") as {scene:Group};
    const modelRef = useRef<Group>(null);
    return  <primitive ref={modelRef} object={scene} scale={[2,2,2]} position={[0, 0, 0]} />
}



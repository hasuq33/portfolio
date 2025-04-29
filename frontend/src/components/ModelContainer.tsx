"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { OrbitControls } from "@react-three/drei";
import { TechGuyModel, PageNotFoundModel } from "./Models";
import Link from "next/link";

const ModelContainer = () => {
    return (
        <div className="flex flex-col   w-[100%]  min-h-screen dark:bg-gray-900 p-4">
            {/* Model Dispaly Sections */}
            <div className="flex lg:flex-row flex-col w-[100%] py-[10%] justify-center ">
                <div className="w-100 flex justify-center">
                    <Canvas>
                        <ambientLight intensity={1.0} />
                        <directionalLight position={[3, 10, 20]} intensity={1} />
                        <Suspense fallback={null}>
                            <TechGuyModel />
                        </Suspense>
                        <OrbitControls enableZoom={false} />
                    </Canvas>
                </div>
                <div className="w-100 flex justify-center">
                    <Canvas>
                        <ambientLight intensity={1.0} />
                        <directionalLight position={[3, 10, 20]} intensity={1} />
                        <Suspense fallback={null}>
                            <PageNotFoundModel />
                        </Suspense>
                        <OrbitControls enableZoom={false} />
                    </Canvas>
                </div>
            </div>
            <div className="flex flex-col justify-center items-center gap-3">
            <h1 className=" text-4xl font-bold dark:text-white text-gray-700">Page Not Found😇</h1>
            <Link href="/">
                <button className=" px-6 py-3 hover:scale-110 cursor-pointer bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md transition">
                    Go to Home Page
                </button>
            </Link>
            </div>
        </div>
    )
}

export default ModelContainer;
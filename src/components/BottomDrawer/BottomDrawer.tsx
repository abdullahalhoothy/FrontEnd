import { useEffect, useState, useRef } from "react";

const BottomDrawer = ({ open, onOpenChange, currentSnap = 0.25, defaultSnap = 0.25, modal = true, snapPoints = [0, 0.25, 0.5, 1], children }) => {
    const [startY, setStartY] = useState(null);
    const [drawerHeight, setDrawerHeight] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState(open ? defaultSnap : 0);
    const [initialPosition, setInitialPosition] = useState(open ? defaultSnap : 0);
    const lastY = useRef(0);
    const lastTime = useRef(0);
    const velocity = useRef(0);

    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [open]);

    useEffect(() => {
        setPosition(open ? defaultSnap : 0);
        setInitialPosition(open ? defaultSnap : 0);
    }, [open, defaultSnap]);

    useEffect(() => {
        if (currentSnap === 0.5) {
            setPosition(currentSnap);
            setInitialPosition(currentSnap);
        }
    }, [currentSnap]);

    const handleTouchStart = (e) => {
        setStartY(e.touches[0].clientY);
        lastY.current = e.touches[0].clientY;
        lastTime.current = Date.now();
        setIsDragging(true);
        setInitialPosition(position);
        velocity.current = 0;
    };

    const handleTouchMove = (e) => {
        if (isDragging) {
            const currentY = e.touches[0].clientY;
            const currentTime = Date.now();
            const deltaY = lastY.current - currentY;
            const deltaTime = currentTime - lastTime.current;

            if (deltaTime > 0) {
                velocity.current = deltaY / deltaTime;
            }

            if (drawerHeight) {
                const newPosition = Math.max(0, Math.min(1, initialPosition + (startY - currentY) / drawerHeight));
                setPosition(newPosition);
            }

            lastY.current = currentY;
            lastTime.current = currentTime;
        }
    };

    const handleTouchEnd = () => {
        if (isDragging) {
            const currentPosition = position;
            let targetPosition;

            if (Math.abs(velocity.current) > 0.5) {
                // Fast swipe
                if (velocity.current > 0) {
                    // Swiping up
                    targetPosition = snapPoints.find(point => point > currentPosition) || snapPoints[snapPoints.length - 1];
                } else {
                    // Swiping down
                    targetPosition = [...snapPoints].reverse().find(point => point < currentPosition) || snapPoints[0];
                }
            } else {
                // Slow drag, snap to closest point
                targetPosition = snapPoints.reduce((prev, curr) =>
                    Math.abs(curr - currentPosition) < Math.abs(prev - currentPosition) ? curr : prev
                );
            }

            setPosition(targetPosition);
            onOpenChange(targetPosition !== snapPoints[0]);
        }

        setStartY(null);
        setIsDragging(false);
        velocity.current = 0;
    };

    return (
        <>
            {open && modal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        zIndex: 20,
                    }}
                    onClick={() => onOpenChange(false)}
                />
            )}
            <div
                style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'white',
                    boxShadow: '0 -4px 6px rgba(0,0,0,0.1)',
                    transform: `translateY(${(1 - position) * 100}%)`,
                    transition: isDragging ? 'none' : 'transform 0.3s ease',
                    zIndex: 20,
                }}
                className="border-2 border-primary border-b-none rounded-t-[10px] h-screen max-h-[97%] mx-[-1px]"

                ref={(el) => {
                    if (el && !drawerHeight) {
                        setDrawerHeight(el.getBoundingClientRect().height);
                    }
                }}
            >
                <div
                    style={{
                        width: '100%',
                        height: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                    }}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    {/* Drag handle */}
                    <div
                        style={{
                            width: '50px',
                            height: '6px',
                            borderRadius: '99px',
                            background: '#ccc',
                        }}
                    ></div>
                </div>
                {children}
            </div>
        </>
    );
};

export default BottomDrawer;


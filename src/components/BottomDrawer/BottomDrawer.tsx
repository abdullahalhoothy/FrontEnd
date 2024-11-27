import { useEffect, useState } from "react";

const BottomDrawer = ({ open, onOpenChange, defaultSnap = 0.25, modal = true, snapPoints = [0, 0.25, 0.5, 1], children }) => {
    const [startY, setStartY] = useState(null);
    const [drawerHeight, setDrawerHeight] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState(open ? defaultSnap : 0);
    const [initialPosition, setInitialPosition] = useState(open ? defaultSnap : 0);


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

    const handleTouchStart = (e) => {
        setStartY(e.touches[0].clientY);
        setIsDragging(true);
        setInitialPosition(position);
    };

    const handleTouchMove = (e) => {
        if (isDragging) {
            const currentY = e.touches[0].clientY;
            const deltaY = startY - currentY; // Positive when dragging up

            if (drawerHeight) {
                const newPosition = Math.max(0, Math.min(1, initialPosition + deltaY / drawerHeight));
                setPosition(newPosition);
            }
        }
    };

    const handleTouchEnd = () => {
        if (isDragging) {
            const currentPosition = position;

            const closestSnapPoint = snapPoints.reduce((prev, curr) =>
                Math.abs(curr - currentPosition) < Math.abs(prev - currentPosition) ? curr : prev
            );

            setPosition(closestSnapPoint);

            // Notify parent about open/close state
            if (closestSnapPoint === 0) {
                onOpenChange(false); // Fully close
            } else {
                onOpenChange(true); // Open
            }
        }

        setStartY(null);
        setIsDragging(false);
    };

    useEffect(() => {
        setPosition(open ? defaultSnap : 0);
        setInitialPosition(open ? defaultSnap : 0);
    }, [open, defaultSnap]);

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
                className="border-2 border-primary border-b-none rounded-t-[10px] h-full max-h-[97%] mx-[-1px]"

                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                ref={(el) => {
                    if (el && !drawerHeight) {
                        setDrawerHeight(el.getBoundingClientRect().height);
                    }
                }}
            >
                <div
                    style={{
                        width: '100%',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                    }}
                >
                    {/* Drag handle */}
                    <div
                        style={{
                            width: '50px',
                            height: '6px',
                            borderRadius: '99px',
                            background: '#ccc',
                            marginTop: '8px',

                        }}
                    ></div>
                </div>
                {children}
            </div>
        </>
    );
};

export default BottomDrawer;
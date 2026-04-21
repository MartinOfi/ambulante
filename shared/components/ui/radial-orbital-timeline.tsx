"use client";
import { useState, useEffect, useRef } from "react";
import { ArrowRight, Link as LinkIcon, Zap } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export interface TimelineItem {
  id: number;
  title: string;
  date: string;
  content: string;
  category: string;
  icon: React.ElementType;
  relatedIds: number[];
  status: "completed" | "in-progress" | "pending";
  energy: number;
}

interface RadialOrbitalTimelineProps {
  timelineData: TimelineItem[];
}

export default function RadialOrbitalTimeline({ timelineData }: RadialOrbitalTimelineProps) {
  const [mounted, setMounted] = useState<boolean>(false);
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [pulseEffect, setPulseEffect] = useState<Record<number, boolean>>({});
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) setAutoRotate(false);
    const handler = (e: MediaQueryListEvent) => setAutoRotate(!e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  const containerRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === containerRef.current || e.target === orbitRef.current) {
      setExpandedItems({});
      setActiveNodeId(null);
      setPulseEffect({});
      setAutoRotate(true);
    }
  };

  const getRelatedItems = (itemId: number): number[] => {
    const currentItem = timelineData.find((item) => item.id === itemId);
    return currentItem ? currentItem.relatedIds : [];
  };

  const centerViewOnNode = (nodeId: number) => {
    if (!nodeRefs.current[nodeId]) return;
    const nodeIndex = timelineData.findIndex((item) => item.id === nodeId);
    const totalNodes = timelineData.length;
    const targetAngle = (nodeIndex / totalNodes) * 360;
    setRotationAngle(270 - targetAngle);
  };

  const toggleItem = (id: number) => {
    setExpandedItems((prev) => {
      const newState: Record<number, boolean> = {};
      Object.keys(prev).forEach((key) => {
        newState[parseInt(key)] = false;
      });
      newState[id] = !prev[id];

      if (!prev[id]) {
        setActiveNodeId(id);
        setAutoRotate(false);
        const relatedItems = getRelatedItems(id);
        const newPulseEffect: Record<number, boolean> = {};
        relatedItems.forEach((relId) => {
          newPulseEffect[relId] = true;
        });
        setPulseEffect(newPulseEffect);
        centerViewOnNode(id);
      } else {
        setActiveNodeId(null);
        setAutoRotate(true);
        setPulseEffect({});
      }

      return newState;
    });
  };

  useEffect(() => {
    if (!autoRotate) return;
    const rotationTimer = setInterval(() => {
      setRotationAngle((prev) => {
        const newAngle = (prev + 0.3) % 360;
        return Number(newAngle.toFixed(3));
      });
    }, 50);
    return () => clearInterval(rotationTimer);
  }, [autoRotate]);

  const calculateNodePosition = (index: number, total: number) => {
    const angle = ((index / total) * 360 + rotationAngle) % 360;
    const radius = 200;
    const radian = (angle * Math.PI) / 180;
    const x = radius * Math.cos(radian);
    const y = radius * Math.sin(radian);
    const zIndex = Math.round(100 + 50 * Math.cos(radian));
    const opacity = Math.max(0.4, Math.min(1, 0.4 + 0.6 * ((1 + Math.sin(radian)) / 2)));
    return { x, y, angle, zIndex, opacity };
  };

  const isRelatedToActive = (itemId: number): boolean => {
    if (!activeNodeId) return false;
    return getRelatedItems(activeNodeId).includes(itemId);
  };

  const getStatusStyles = (status: TimelineItem["status"]): string => {
    switch (status) {
      case "completed":
        return "text-white bg-brand border-brand";
      case "in-progress":
        return "text-surface bg-foreground border-foreground";
      case "pending":
        return "text-foreground bg-foreground/10 border-foreground/40";
      default:
        return "text-foreground bg-foreground/10 border-foreground/40";
    }
  };

  return (
    <div
      className="relative w-full h-[480px] md:h-[560px] flex items-center justify-center overflow-hidden"
      ref={containerRef}
      onClick={handleContainerClick}
    >
      <div className="relative w-full max-w-4xl h-full flex items-center justify-center">
        <div
          className="absolute w-full h-full flex items-center justify-center"
          ref={orbitRef}
          style={{ perspective: "1000px" }}
        >
          {/* Center sun — brand orange aura (fixed palette, works in both themes) */}
          <div className="absolute w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 via-brand to-orange-700 animate-pulse flex items-center justify-center z-10">
            <div className="absolute w-20 h-20 rounded-full border border-foreground/20 animate-ping opacity-70" />
            <div
              className="absolute w-24 h-24 rounded-full border border-foreground/10 animate-ping opacity-50"
              style={{ animationDelay: "0.5s" }}
            />
            <div className="w-8 h-8 rounded-full bg-foreground/80 backdrop-blur-md" />
          </div>

          {/* Orbit ring */}
          <div className="absolute w-[400px] h-[400px] rounded-full border border-foreground/10" />

          {mounted &&
            timelineData.map((item, index) => {
              const position = calculateNodePosition(index, timelineData.length);
              const isExpanded = expandedItems[item.id];
              const isRelated = isRelatedToActive(item.id);
              const isPulsing = pulseEffect[item.id];
              const Icon = item.icon;

              const nodeStyle = {
                transform: `translate(${position.x}px, ${position.y}px)`,
                zIndex: isExpanded ? 200 : position.zIndex,
                opacity: isExpanded ? 1 : position.opacity,
              };

              return (
                <div
                  key={item.id}
                  ref={(el) => {
                    nodeRefs.current[item.id] = el;
                  }}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  aria-label={`${item.title}. ${item.content}`}
                  className="absolute transition-all duration-700 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface rounded-full"
                  style={nodeStyle}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleItem(item.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleItem(item.id);
                    }
                  }}
                >
                  <div
                    className={`absolute rounded-full -inset-1 ${
                      isPulsing ? "animate-pulse duration-1000" : ""
                    }`}
                    style={{
                      background:
                        "radial-gradient(circle, rgba(234,88,12,0.35) 0%, rgba(234,88,12,0) 70%)",
                      width: `${item.energy * 0.5 + 40}px`,
                      height: `${item.energy * 0.5 + 40}px`,
                      left: `-${(item.energy * 0.5) / 2}px`,
                      top: `-${(item.energy * 0.5) / 2}px`,
                    }}
                  />

                  <div
                    className={`
                    w-12 h-12 rounded-full flex items-center justify-center
                    ${
                      isExpanded
                        ? "bg-brand text-white"
                        : isRelated
                          ? "bg-surface-elevated text-brand"
                          : "bg-foreground text-surface"
                    }
                    border-2
                    ${
                      isExpanded
                        ? "border-surface shadow-lg shadow-brand/40"
                        : isRelated
                          ? "border-brand animate-pulse"
                          : "border-foreground/40"
                    }
                    transition-all duration-300 transform
                    ${isExpanded ? "scale-150" : ""}
                  `}
                  >
                    <Icon size={18} />
                  </div>

                  <div
                    className={`
                    absolute top-14 left-1/2 -translate-x-1/2 whitespace-nowrap
                    text-[11px] font-display font-bold uppercase tracking-[0.18em]
                    transition-all duration-300
                    ${isExpanded ? "text-foreground scale-110" : "text-muted"}
                  `}
                  >
                    {item.title}
                  </div>

                  {isExpanded && (
                    <Card className="absolute top-24 left-1/2 -translate-x-1/2 w-72 bg-surface-elevated/95 backdrop-blur-lg border-border shadow-xl shadow-brand/20 overflow-visible">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-px h-3 bg-foreground/50" />
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <Badge className={`px-2 text-[10px] ${getStatusStyles(item.status)}`}>
                            {item.status === "completed"
                              ? "LISTO"
                              : item.status === "in-progress"
                                ? "EN CURSO"
                                : "PRÓXIMO"}
                          </Badge>
                          <span className="text-[10px] font-mono text-muted">{item.date}</span>
                        </div>
                        <CardTitle className="text-base mt-2 text-foreground font-display uppercase tracking-tight">
                          {item.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-xs text-foreground/80">
                        <p className="leading-relaxed">{item.content}</p>

                        <div className="mt-4 pt-3 border-t border-border">
                          <div className="flex justify-between items-center text-[10px] mb-1">
                            <span className="flex items-center text-muted">
                              <Zap size={10} className="mr-1" />
                              Intensidad
                            </span>
                            <span className="font-mono text-foreground">{item.energy}%</span>
                          </div>
                          <div className="w-full h-1 bg-foreground/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-orange-400 to-brand"
                              style={{ width: `${item.energy}%` }}
                            />
                          </div>
                        </div>

                        {item.relatedIds.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-border">
                            <div className="flex items-center mb-2">
                              <LinkIcon size={10} className="text-muted mr-1" />
                              <h4 className="text-[10px] uppercase tracking-wider font-medium text-muted">
                                Pasos conectados
                              </h4>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {item.relatedIds.map((relatedId) => {
                                const relatedItem = timelineData.find((i) => i.id === relatedId);
                                return (
                                  <Button
                                    key={relatedId}
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center h-6 px-2 py-0 text-[10px] rounded-full border-border bg-transparent hover:bg-foreground/10 text-muted hover:text-foreground transition-all"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleItem(relatedId);
                                    }}
                                  >
                                    {relatedItem?.title}
                                    <ArrowRight size={8} className="ml-1 text-muted" />
                                  </Button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

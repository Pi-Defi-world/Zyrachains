"use client";

import { Business } from '@/lib/types';
import ProjectDetail from '@/app/pages/ProjectDetail';

interface ProjectDetailWrapperProps {
  initialProject: Business | null;
  id: string;
}

export default function ProjectDetailWrapper({ initialProject, id }: ProjectDetailWrapperProps) {
  return <ProjectDetail id={id} initialProject={initialProject} />;
}

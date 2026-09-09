declare module 'react-graph-vis' {
  import { Component } from 'react';

  export interface GraphData {
    nodes: any[];
    edges: any[];
  }

  export interface GraphOptions {
    [key: string]: any;
  }

  export interface GraphEvents {
    [key: string]: (params?: any) => void;
  }

  export interface GraphProps {
    graph: GraphData;
    options?: GraphOptions;
    events?: GraphEvents;
    getNetwork?: (network: any) => void;
    style?: React.CSSProperties;
    getNodes?: (nodes: any) => void;
    getEdges?: (edges: any) => void;
  }

  export default class Graph extends Component<GraphProps> {}
} 
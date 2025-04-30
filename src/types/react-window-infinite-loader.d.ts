declare module "react-window-infinite-loader" {
  import * as React from "react";
  import { ListChildComponentProps, GridChildComponentProps } from "react-window";

  export type InfiniteLoaderProps = {
    isItemLoaded: (index: number) => boolean;
    loadMoreItems: (startIndex: number, stopIndex: number) => Promise<void> | void;
    itemCount: number;
    children: (props: {
      onItemsRendered: (props: any) => any;
      ref: React.Ref<any>;
    }) => React.ReactNode;
    threshold?: number;
    minimumBatchSize?: number;
  };

  const InfiniteLoader: React.ComponentType<InfiniteLoaderProps>;

  export default InfiniteLoader;
}

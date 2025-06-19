import { Node, mergeAttributes, nodeInputRule } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { ImageResizer } from './image-resizer';
import React, { useState, useCallback } from 'react';

export interface ImageOptions {
  inline: boolean;
  allowBase64: boolean;
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    customImage: {
      setImage: (options: { src: string; alt?: string; title?: string; width?: number; height?: number }) => ReturnType;
    };
  }
}

const inputRegex = /(?:^|\s)(!\[(.+|:?)]\((\S+)(?:(?:\s+)["'](\S+)["'])?\))$/;

const ImageComponent = ({ node, updateAttributes, deleteNode }: any) => {
  const [showResizer, setShowResizer] = useState(false);
  const { src, alt, title, width, height } = node.attrs;

  const handleImageClick = useCallback(() => {
    setShowResizer(true);
  }, []);

  const handleResize = useCallback((newWidth: number, newHeight: number) => {
    updateAttributes({ width: newWidth, height: newHeight });
  }, [updateAttributes]);

  const handleCrop = useCallback((cropData: { x: number; y: number; width: number; height: number }) => {
    // For now, we'll just update the dimensions
    // In a full implementation, you might want to actually crop the image
    updateAttributes({ width: cropData.width, height: cropData.height });
  }, [updateAttributes]);

  const handleClose = useCallback(() => {
    setShowResizer(false);
  }, []);

  return (
    <NodeViewWrapper className="image-node-view">
      <img
        src={src}
        alt={alt}
        title={title}
        className="editor-image cursor-pointer"
        onClick={handleImageClick}
        draggable={false}
        style={{
          width: width ? `${width}px` : 'auto',
          height: height ? `${height}px` : 'auto',
          maxWidth: '100%'
        }}
      />
      {showResizer && (
        <ImageResizer
          src={src}
          alt={alt}
          initialWidth={width || 300}
          initialHeight={height || 200}
          onResize={handleResize}
          onCrop={handleCrop}
          onClose={handleClose}
        />
      )}
    </NodeViewWrapper>
  );
};

export const CustomImage = Node.create<ImageOptions>({
  name: 'customImage',

  addOptions() {
    return {
      inline: false,
      allowBase64: false,
      HTMLAttributes: {},
    };
  },

  inline() {
    return this.options.inline;
  },

  group() {
    return this.options.inline ? 'inline' : 'block';
  },

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      width: {
        default: null,
      },
      height: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: this.options.allowBase64
          ? 'img[src]'
          : 'img[src]:not([src^="data:"])',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },

  addCommands() {
    return {
      setImage:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },

  addInputRules() {
    return [
      nodeInputRule({
        find: inputRegex,
        type: this.type,
        getAttributes: (match) => {
          const [, , alt, src, title] = match;
          return { src, alt, title };
        },
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageComponent);
  },
});
// 导出 `request` 模块的默认导出
export { default } from './request';

/**
 * 将 `note` 模块的所有导出绑定到 `note` 命名空间，并重新导出。
 * 这使得可以通过 `import { note } from '路径';` 来访问 `note` 模块的内容。
 */
export * as note from './note';

/**
 * 将 `comment` 模块的所有导出绑定到 `comment` 命名空间，并重新导出。
 * 这使得可以通过 `import { comment } from '路径';` 来访问 `comment` 模块的内容。
 */
export * as comment from './comment';

/**
 * 将 `user` 模块的所有导出绑定到 `user` 命名空间，并重新导出。
 * 这使得可以通过 `import { user } from '路径';` 来访问 `user` 模块的内容。
 */
export * as user from './user';

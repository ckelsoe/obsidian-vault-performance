// Runtime stand-in for the `obsidian` package, which ships types only. Jest
// picks this up automatically for every `import ... from 'obsidian'`. Add only
// what code under test actually touches.

export class Plugin {}

export class PluginSettingTab {
	constructor(
		public app: unknown,
		public plugin: unknown,
	) {}
}

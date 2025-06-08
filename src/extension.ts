import { text } from 'stream/consumers';
import * as vscode from 'vscode';

const DEFAULT_METHOD = 'initialize';

function isRubyFile(document: vscode.TextDocument): boolean {
	if(document.languageId !== 'ruby'){
		vscode.window.showInformationMessage('This is not a Ruby file.');
	}

	return document.languageId === 'ruby';
}

function activeEditor(): vscode.TextEditor | false{
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showErrorMessage('No active editor found.');
		return false;
	}

	return editor;
}

function findSelectedMethod(document: vscode.TextDocument, editor: vscode.TextEditor): string {
	let selectedMethod = document.getText(editor.selection).trim();

	if (!selectedMethod) {
		selectedMethod = DEFAULT_METHOD;
	}

	return selectedMethod;
}

function findMatch(selectedMethod: string, fileText: string): string | false {
    const methodRegex = new RegExp(`def\\s+${selectedMethod}\\s*\\([^\\)]*\\)`, 'g');
    const matches = fileText.match(methodRegex);

    if (!matches || matches.length === 0) {
        vscode.window.showErrorMessage(`Method "${selectedMethod}" not found.`);
        return false;
    }

	if (matches.length > 1) {
		vscode.window.showErrorMessage(`Multiple methods named "${selectedMethod}" found. Please refine your selection.`);
		return false;
	}

    return matches[0];
}

function extractParameters(methodLine: string): string[] | false {
    const paramsMatch = methodLine.match(/\(([^)]*)\)/);

    if (!paramsMatch) {
        vscode.window.showInformationMessage('No parameters found (no parentheses in method definition).');
        return false;
    }

    const paramsString = paramsMatch[1].trim();

    if (!paramsString) {
        vscode.window.showInformationMessage('Parameters list is empty.');
        return false;
    }

    let paramsArray = paramsString.split(',').map(param => param.trim());
	paramsArray = paramsArray.filter(param => param.length > 0);

	if (paramsArray.length === 0) {
		vscode.window.showInformationMessage('No parameters found.');
		return false;
	}
	
	paramsArray = paramsArray.map(param => {
		if (param.includes('=')){
			param.split('=');
			return param.split('=')[0].trim();
		}else if(param.includes(':')){
			param.split(':');
			return param.split(':')[0].trim();
		}
		return param;
	});

    return paramsArray;
}

function calculateIndentation(fileText: string, editor: vscode.TextEditor): string {
	const indentSize = editor.options.tabSize as number || 2;
	const useSpaces = editor.options.insertSpaces !== false;

	const moduleCount = (fileText.match(/module/g) || []).length;

	const indentLevel = moduleCount + 2;

	if (useSpaces) {
		return ' '.repeat(indentLevel * indentSize);
	} else {
		return '\t'.repeat(indentLevel);
	}
}

function prepareTextToBeInserted(params: string[], match: string, fileText: string, editor: vscode.TextEditor): string | false {
	const endIndex = fileText.indexOf('end', fileText.indexOf(match) + match.length);
	if (endIndex === -1) {
		vscode.window.showErrorMessage('Could not find the end of the method.');
		return false;
	}
	const methodBody = fileText.substring(fileText.indexOf(match) + match.length, endIndex).trim();
	params = params.filter(param => !methodBody.includes(`@${param}`));

	if (params.length === 0) {
		vscode.window.showInformationMessage('No new parameters to add.');
		return false;
	}

	const paramsText = params.map(param => `${calculateIndentation(fileText, editor)}@${param} = ${param}`).join('\n');

	return `${match}\n${paramsText}`;
}

function injectText(editor:vscode.TextEditor, document: vscode.TextDocument, match: string, textToBeInserted: string) {
	const startPosition = document.positionAt(document.getText().indexOf(match));
	const endPosition = document.positionAt(document.getText().indexOf(match) + match.length);
	const edit = new vscode.WorkspaceEdit();
	edit.replace(document.uri, new vscode.Range(startPosition, endPosition), textToBeInserted);
	vscode.workspace.applyEdit(edit).then(success => {
			if (success) {
				vscode.window.showInformationMessage('Parameters added successfully.');
			} else {
				vscode.window.showErrorMessage('Failed to add parameters.');
			}
		}
	);
}

export function activate(context: vscode.ExtensionContext) {
	const disposable = vscode.commands.registerCommand('init-mate.addParameters', async () => {
		const editor = activeEditor();
		if(!editor){ return; }

		const document = editor.document;
		const fileText = document.getText();
		const selectedMethod = findSelectedMethod(document, editor);

		if (!isRubyFile(document)) { return; }

		const match = findMatch(selectedMethod, fileText);
		if(!match) { return; }

		const params = extractParameters(match);
		if(!params) { return; }

		const textToBeInserted = prepareTextToBeInserted(params, match, fileText, editor);
		if(!textToBeInserted) { return; }

		injectText(editor, document, match, textToBeInserted);
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}

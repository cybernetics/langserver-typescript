import {
    RequestType, IConnection
} from 'vscode-languageserver';

import * as fs from 'fs';
import * as path_ from 'path';

export interface FileInfo {
    Name_: string
	Size_: number
	Dir_:  boolean
}

export interface FileSystem {
    readDir(path: string, callback: (err: Error, result? : FileInfo[]) => void)
    readFile(path: string, callback: (err: Error, result? : string) => void)
}

namespace ReadDirRequest {
    export const type: RequestType<string, FileInfo[], any> = { get method() { return 'fs/readDir'; } };
}

namespace ReadFileRequest {
    export const type: RequestType<string, string, any> = { get method() { return 'fs/readFile'; } };
}

export class RemoteFileSystem implements FileSystem {

    private connection: IConnection;

    constructor(connection: IConnection) {
        this.connection = connection
    }

    readDir(path: string, callback: (err: Error, result? : FileInfo[]) => void) {
        this.connection.sendRequest(ReadDirRequest.type, path).then((f: FileInfo[]) => {
            return callback(null, f)
        }, (err: Error) => {
            return callback(err)
        })        
    }

    readFile(path: string, callback: (err: Error, result? : string) => void) {
        this.connection.sendRequest(ReadFileRequest.type, path).then((content: string) => {
            return callback(null, Buffer.from(content, 'base64').toString())
        }, (err: Error) => {
            return callback(err)
        })        
    }

}

export class LocalFileSystem implements FileSystem {

    private root: string;

    constructor(root: string) {
        this.root = root
    }

    readDir(path: string, callback: (err: Error, result? : FileInfo[]) => void) {
        path = path_.resolve(this.root, path);
        fs.readdir(path, function(err: Error, files: string[]) {
            if (err) {
                return callback(err)
            }
            let ret : FileInfo[] = [];
            files.forEach(function(f) {
                const stats : fs.Stats = fs.statSync(path_.resolve(path, f));
                ret.push({
                    Name_: f,
                    Size_: stats.size,
                    Dir_: stats.isDirectory()
                })
            });
            return callback(null, ret)
        });
    }

    readFile(path: string, callback: (err: Error, result? : string) => void) {
        path = path_.resolve(this.root, path);
        fs.readFile(path, function(err: Error, buf : Buffer) {
            if (err) {
                return callback(err)
            }
            return callback(null, buf.toString())
        });
    }

}
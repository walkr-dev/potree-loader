// Create enums for different types of workers
export enum WorkerType {
	DECODER_WORKER_BROTLI = "DECODER_WORKER_BROTLI",
	DECODER_WORKER = "DECODER_WORKER",
}

function createWorker(type: WorkerType): Worker {
	type
	const ctor = require('./decoder.worker.js');
    return new ctor();
	// switch (type) {
	// 	case WorkerType.DECODER_WORKER_BROTLI: {
    //         // const ctor = require("./brotli-decoder.worker.js");
    //         // return new ctor();
    //     }
	// 	case WorkerType.DECODER_WORKER: {
    //         // let ctor = require("./decoder.worker.js");
    //         // return new ctor();
    //     }
	// 	default:
	// 		throw new Error("Unknown worker type");
	// }
}


export class WorkerPool{
    // Workers will be an object that has a key for each worker type and the value is an array of Workers that can be empty
	private workers: { [key in WorkerType]: Worker[] } = {DECODER_WORKER: [], DECODER_WORKER_BROTLI: []};

	getWorker(workerType: WorkerType): Worker{
		// Throw error if workerType is not recognized
		if (this.workers[workerType] === undefined) {
			throw new Error("Unknown worker type");
		}
		// Given a worker URL, if URL does not exist in the worker object, create a new array with the URL as a key
		if (this.workers[workerType].length === 0){
			let worker = createWorker(workerType);
			this.workers[workerType].push(worker);
		}
		let worker = this.workers[workerType].pop();
		if (worker === undefined) { // Typescript needs this
			throw new Error("No workers available");
		}
		// Return the last worker in the array and remove it from the array
		return worker;
	}

	returnWorker(workerType: WorkerType, worker:Worker){
		this.workers[workerType].push(worker);
	}
};

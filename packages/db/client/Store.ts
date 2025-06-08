// export class Store {
//     constructor() {
//         const request = indexedDB.open("MyTestDatabase");
//         let db;
//         request.onerror = (event) => {
//             console.error(`Failed to open IndexedDB database: ${event.target.error?.message}`);
//         };
//         request.onsuccess = (event) => {
//         };
//     }
// }
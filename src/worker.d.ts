declare module '*?worker' {
    const workerConstructor: {
        new (): Worker;
    };
    // eslint-disable-next-line import/no-default-export
    export default workerConstructor;
}

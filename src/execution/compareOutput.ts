export function compareOutput(
    expected:string,
    actual:string
) : boolean{
    return expected.trim()===actual.trim()
}
//TODO : implemnt later special judges/ floating point tolerance
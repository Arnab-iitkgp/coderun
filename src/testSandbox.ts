import { executeCpp } from "./execution/cppExecutor.js";

const code = `
#include <iostream>
using namespace std;

int main(){
    int a,b;
    cin>>a>>b;
    cout<<a+b;
}
`;

async function test(){

  const result = await executeCpp(
    1,
    code,
    "2 3"
  );

  console.log(result);

}

test();
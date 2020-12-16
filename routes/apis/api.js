import * as service from "../../services/services.js"

const getHello = ({response}) => {
    response.body = {message: service.getHello()};
};

const setHello = async({request, response}) => {
    try{
        const body = request.body({type: 'json'});
        const document = await body.value;
        service.setHello(document.message);
        response.status = 200;
    } catch (e) {
        console.log(e);
    }
};
   
const simpleSummary = async({response}) => {
    const date = new Date();
    const data = await service.getApiWeekSummary(date);
    console.log(data);
    response.body = data;
}

const specificSummary = async({response, params}) => {
    const date = new Date(Number(params.year), Number(params.month) - 1, Number(params.day) );
    console.log(`year: ${params.year}, month: ${params.month }, day: ${params.day }`);
    console.log(date);
    const data = await service.getApiDaySummary(date);
    console.log(data);
    response.body = data;
}


export { getHello, setHello, simpleSummary, specificSummary };


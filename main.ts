/**
* PMS空氣品質感測積木
*/

//% weight=0 color=#f2780c icon="\uf2a1" block="PlanTower PMS sensor" block.loc.zh-tw="攀藤PMS感測器"
namespace PMS {
    let pms_tx = SerialPin.P1
    let pms_rx = SerialPin.P2
    let singleBuffer=pins.createBuffer(1)
    let receivedBuff=pins.createBuffer(30)
    let sendBuff=pins.createBuffer(7);
    let myPmsEvent: Action = null
    let init=false;
    let pmsData: number[] = [0,0,0,0,0,0,0,0];
    export enum pmsDataList {
        //% block="Standard Particles PM1.0" block.loc.zh-tw="標準顆粒PM1.0"
        PM_SP_UG_1_0 = 0,
        //% block="Standard Particles PM2.5" block.loc.zh-tw="標準顆粒PM2.5"
        PM_SP_UG_2_5 = 1,
        //% block="Standard Particles PM10" block.loc.zh-tw="標準顆粒PM10"
        PM_SP_UG_10_0 = 2,
        //% block="Atmospheric Environment PM1.0" block.loc.zh-tw="大氣環境PM1.0"
        PM_AE_UG_1_0 = 3,
        //% block="Atmospheric Environment PM2.5" block.loc.zh-tw="大氣環境PM2.5"
        PM_AE_UG_2_5 = 4,
        //% block="Atmospheric Environment PM10" block.loc.zh-tw="大氣環境PM10"
        PM_AE_UG_10_0 = 5
    }

    export enum pmsTList {
        //% block="Temperature(C)" block.loc.zh-tw="溫度(C)"
        t_type1 = 6,
        //% block="Humidity(%)" block.loc.zh-tw="濕度(%)"
        t_type2 = 7
    }

    //% blockId="pmsSetSerial" block="PMS initial|RX connect to %pinTX|TX connect to %pinRX" block.loc.zh-tw="PMS 初始化|RX連接到 %pinTX|TX連接到 %pinRX"
    //% weight=100 blockGap=20 pinTX.defl=SerialPin.P1 pinRX.defl=SerialPin.P2
    export function pmsSetSerial(pinTX: SerialPin, pinRX: SerialPin): void {
        serial.setRxBufferSize(32)
        pms_tx = pinTX;
        pms_rx = pinRX;
        serial.redirect(
            pms_tx,
            pms_rx,
            BaudRate.BaudRate9600
        )
        basic.pause(100)
        init=true;
    }

    //% weight=90
    //% blockId="pmsEvent" block="PMS on data received" block.loc.zh-tw="PMS 當感測到資料時"
    export function pmsEvent(tempAct: Action) {
        myPmsEvent=tempAct;
    }
    basic.forever(() => {
        if (!init)
          return;
        singleBuffer = serial.readBuffer(1);
        let firstByte=singleBuffer.getNumber(NumberFormat.UInt8LE, 0);
        while(firstByte!=0x42)
        {
          singleBuffer = serial.readBuffer(1);
          firstByte=singleBuffer.getNumber(NumberFormat.UInt8LE, 0);
        }
        singleBuffer = serial.readBuffer(1);
        let secondByte=singleBuffer.getNumber(NumberFormat.UInt8LE, 0);       
        if(myPmsEvent != null && secondByte==0x4d){
          receivedBuff = serial.readBuffer(30);
          // Standard Particles, CF=1.
          pmsData[0]=receivedBuff.getNumber(NumberFormat.UInt8LE, 8)<<8 ||receivedBuff.getNumber(NumberFormat.UInt8LE, 9);
          pmsData[1]=receivedBuff.getNumber(NumberFormat.UInt8LE, 10)<<8 ||receivedBuff.getNumber(NumberFormat.UInt8LE, 11);
          pmsData[2]=receivedBuff.getNumber(NumberFormat.UInt8LE, 12)<<8 ||receivedBuff.getNumber(NumberFormat.UInt8LE, 13);
          // Atmospheric Environment.
          pmsData[3]=receivedBuff.getNumber(NumberFormat.UInt8LE, 14)<<8 ||receivedBuff.getNumber(NumberFormat.UInt8LE, 15);
          pmsData[4]=receivedBuff.getNumber(NumberFormat.UInt8LE, 16)<<8 ||receivedBuff.getNumber(NumberFormat.UInt8LE, 17);
          pmsData[5]=receivedBuff.getNumber(NumberFormat.UInt8LE, 18)<<8 ||receivedBuff.getNumber(NumberFormat.UInt8LE, 19);
          // Temperature Humidity
          pmsData[6]=receivedBuff.getNumber(NumberFormat.UInt8LE, 22)<<8 ||receivedBuff.getNumber(NumberFormat.UInt8LE, 23);
          pmsData[7]=receivedBuff.getNumber(NumberFormat.UInt8LE, 24)<<8 ||receivedBuff.getNumber(NumberFormat.UInt8LE, 25);
          myPmsEvent();
          pmsData= [0,0,0,0,0,0,0,0];
        }
    })

    //% weight=80
    //% blockId="pmsGetData" block="PMS read %myDataIndex|μg/m3" block.loc.zh-tw="PMS 讀取 %myDataIndex|值(μg/m3)"
    export function pmsGetData(myDataIndex: pmsDataList): number {
        return pmsData[myDataIndex];
    }

    //% weight=70
    //% blockId="pmsGetDataT" block="PMS(T) read %myDataIndex|(only for model T)" block.loc.zh-tw="PMS(適用T型號) 讀取 %myDataIndex"
    export function pmsGetDataT(myDataIndex: pmsTList): number {
        return pmsData[myDataIndex]/10.0;
    }

}
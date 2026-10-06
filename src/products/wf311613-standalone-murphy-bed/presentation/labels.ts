import {fullProduct} from '../product/parts-step21-31';

/** Display metadata only. PDF IDs, instance IDs and definitions stay intact. */
export const pdfPartNames:Record<string,string>={
  A1:'Side Frame Rail',A2:'Side Frame Rail',A3:'Side Frame Rail',A4:'Side Frame Rail',
  A5:'Left Side Panel',A6:'Right Side Panel',A7:'Side Support Rail',A8:'Side Support Rail',A9:'Lower Side Panel',
  B1:'Top Frame Rail',B2:'Top Cross Rail',B3:'Top Center Support',B4:'Top Infill Panel',
  B5:'Upper Front Rail',B6:'Upper Rear Rail',B7:'Cabinet Center Support',B8:'Cabinet Back Panel',B9:'Bottom Rear Rail',
  C1:'Bed Face End Rail',C2:'Bed Face Side Rail',C3:'Bed Face Cross Rail',C4:'Bed Face Support Rail',
  C5:'Bed Face Center Rail',C6:'Bed Face Panel',C7:'Underside Support',C8:'Bed Frame Side Rail',C9:'Bed Frame End Rail',
  D1:'Bed Frame End Rail',D2:'Mattress Support Slat',D3:'Folding Leg',D4:'Cabinet Cross Rail',D5:'Lower Front Rail',
  D6:'Leg Foot',D7:'Leg Pivot Arm',D8:'Left Pivot Bracket',D9:'Right Pivot Bracket',
  E1:'Bed Mechanism Plate',E2:'Gas Piston',E3:'Bottom Front Rail',E4:'Lower Center Support',E5:'Cabinet Center Rail',
};
export const hardwareNames:Record<number,string>={
  1:'Bolt',2:'Bolt',3:'Bolt',4:'Bolt',5:'Long Bolt',6:'Wood Dowel',7:'Leg Dowel',8:'Cam Lock',9:'Threaded Cap',
  10:'Plastic Washer',11:'Assembly Tool',12:'Wood Screw',13:'Long Wood Screw',14:'Wood Screw',15:'Wall Bracket',
  16:'Slat Screw',17:'Nut',18:'Pivot Retainer Bolt',19:'Bearing',20:'Angle Bracket',21:'Wood Screw',22:'Long Bolt',
  23:'Wall Screw',24:'Wood Screw',25:'Inner Angle Bracket',
};
export const presentationNameRows=fullProduct.parts.map(part=>{
  const pdfPart=part.id.match(/^[A-E]\d+(?=-|$)/)?.[0];
  const number=part.name.match(/#(\d+)/)?.[1];
  const name=pdfPart?pdfPartNames[pdfPart]:number?hardwareNames[Number(number)]
    :part.id==='bed-motion-root'?'Bed Assembly':part.id.startsWith('leg-')?'Folding Leg Assembly'
    :part.id==='installation-wall'?'Room Wall':undefined;
  if(!name)throw new Error(`Unmapped presentation name: ${part.id}`);
  return {id:part.id,pdfPart:pdfPart??null,hardwareNumber:number?Number(number):null,presentationName:name};
});
export const presentationNames:Record<string,string>=Object.fromEntries(presentationNameRows.map(row=>[row.id,row.presentationName]));

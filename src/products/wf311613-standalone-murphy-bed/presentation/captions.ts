import type {DirectorPlan} from '@/types/director';
import type {VideoDefinition} from '@/types/video';
import {presentationNames} from './labels';

export const stepTitles=[
  'Assemble the Left Side','Assemble the Right Side','Join the Cabinet Base','Build the Lower Cabinet',
  'Build the Middle Cabinet','Complete the Cabinet Frame','Assemble the Top','Fit the Top',
  'Install the Right Pivot Bracket','Install the Left Pivot Bracket','Begin the Bed Face','Build the Center Frame',
  'Fit the Underside Supports','Complete the Side Frame','Close the Bed Face','Assemble the Bed Frame',
  'Join the Two Bed Frames','Reinforce the First Corners','Reinforce the Opposite Corners','Fit the Support Slats',
  'Fit the First Mechanism Plate','Fit the Opposite Mechanism Plate','Attach the First Gas Piston',
  'Attach the Opposite Gas Piston','Connect Bed and Cabinet','Connect the First Gas Piston','Connect the Opposite Gas Piston',
  'Assemble the Folding Legs','Attach the Folding Legs','Secure Cabinet to Wall','Complete Wall Attachment',
];
const overrides:Record<string,string>={
  'S3-square-before-tightening':'Check alignment before tightening.',
  'S13-context':'Support the frame on its edge.',
  'S17-target':'Hold the frame tilted for underside access.',
  'S25-context':'Four people required to lift the bed.',
  'S25-route-4':'Lift together and keep the bed supported.',
  'S25-route-5':'Align both bearings with the pivot brackets.',
  'S25-route-6':'Lower both bearings into place.',
  'S25-complete':'Keep supporting the bed until both pivots are secured.',
  'S31-complete':'Assembly complete.',
  'final-support-lift':'Support and slightly lift the bed.',
  'final-fold-legs':'Fold both legs inward.',
  'final-close':'Close the bed under control.',
  'final-open':'Open the bed under control.',
  'final-deploy-legs':'Unfold both legs.',
  'final-lower-support':'Lower gently until both feet meet the floor.',
  'final-result':'Assembly complete.',
};
/** Every shot receives an explicit decision, including intentionally NO text.
 * This prevents fallback to raw DirectorPlan diagnostics. No hold is added. */
export function cleanCaptions(plan:DirectorPlan):NonNullable<VideoDefinition['reviewCaptions']>{
  let cursor=0;const learned=new Set<string>();
  return plan.steps.flatMap(step=>step.shots.map(shot=>{
    const start=cursor;cursor+=shot.duration;
    let title=overrides[shot.id]??'';
    const action=shot.actions.find(a=>'target'in a&&a.target!=='bed-motion-root'&&a.type.startsWith('install'));
    if(!title&&action&&'target'in action){
      const name=presentationNames[action.target];
      if(!name)throw new Error(`Missing caption label ${action.target}`);
      const fastener=['installScrew','installBolt','installDowel','installNut','installWasher'].includes(action.type);
      if(!fastener||!learned.has(name)||shot.type==='TIGHTEN_HARDWARE'){
        title=action.type==='installNut'&&name==='Cam Lock'?'Turn the cam to lock the joint.'
          :action.type==='installBolt'&&step.step>=3&&step.step<=6?'Start every bolt before tightening.'
          :`Fit the ${name.toLowerCase()}.`;
      }
      if(fastener)learned.add(name);
    }
    if(!title&&shot.type==='TIGHTEN_HARDWARE')title='Tighten the bolts.';
    if(!title&&shot.type==='INTRODUCE_PART'){
      const target=shot.actions.find(a=>a.type==='show');
      if(target?.type==='show')title=presentationNames[target.target];
    }
    return {start,end:cursor,title,note:'',hidden:!title};
  }));
}

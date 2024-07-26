import { GetCollectionDropPhaseDto } from '../../dropphases/dto/getCollectionDropPhase.dto';
import { FrameActionPayload } from 'frames.js';

export type GetStartFrameDto = GetCollectionDropPhaseDto & FrameActionPayload;

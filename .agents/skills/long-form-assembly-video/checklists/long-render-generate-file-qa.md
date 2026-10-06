# L — Long render / Generate File QA
Product/revision/job: ______
Evidence: ______
Status: NOT RUN

- [ ] Deterministic creative source frozen and job identity recorded.
- [ ] Product/profile/native dimensions/FPS and approved audio identity recorded.
- [ ] Chunk plan covers exact frame schedule; configurable size and one worker.
- [ ] Checkpoints persistent/atomic after frames, chunks, retries and stage changes.
- [ ] Existing frames decoded/integrity/dimensions/path/checksum validated; disk reconciled.
- [ ] No cross-product/profile/FPS/revision reuse; changed sources reject Resume.
- [ ] Bounded retries and configured safe browser recycle demonstrated.
- [ ] Cancel preserves work; Resume repairs only missing/invalid work.
- [ ] Delete is explicit and isolated; other jobs/assets/masters preserved.
- [ ] Expected frame count exact; indices contiguous; native dimensions exact.
- [ ] Encoding starts automatically only after complete frame validation.
- [ ] Approved audio applied once at final mux; silent products skip mux.
- [ ] Full decode/profile/timing/audio/hash/faststart verification before completion.
- [ ] One final artifact recorded and downloadable.
- [ ] UI derives truthful stage/frames/chunks/elapsed from backend; no fake encoder percent.
- [ ] Refresh/server restart recover compatible incomplete jobs honestly.
- [ ] Temporary data cleanup deferred until safe; manual retention policy documented.

Record actual results, errors, limitations and director decisions separately.

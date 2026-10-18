Re-posting the two tables as plain text — the Markdown tables in the original post rendered as one cell per line.

### Measurement matrix (same session, host `session/follow` first frame)

```
request                                        records   payload
maxMessages 500 + turnWindow{50,2}  (current)     450    1.09 MB
maxMessages 120 + turnWindow{50,2}                450    1.09 MB
maxMessages 120, no turnWindow                    597    1.27 MB
maxMessages  80, no turnWindow                    407    0.89 MB
maxMessages  50, no turnWindow                    259    0.56 MB
maxMessages  30, no turnWindow                    156    0.35 MB
```

Session: `6.66 MB` v3 log, 24.6 MB raw JSON, 8024 events.

### Before / after (three sessions)

```
session                        records        payload
b724f314  (6.66 MB v3)      450 -> 156    1.09 MB -> 0.35 MB  (-68%)
c7912d98  (5.17 MB v3)      312 -> 151    0.51 MB -> 0.23 MB  (-56%)
56d07a1c  (6.24 MB v3)      403 -> 169    1.37 MB -> 0.73 MB  (-47%)
```

### Timings (host cold / warm / live, first frame)

```
session        cold before -> after    warm after    live after
b724f314          379 ms -> 418 ms          9 ms         9 ms
c7912d98          210 ms -> 210 ms          6 ms         6 ms
56d07a1c          272 ms -> 260 ms         19 ms        19 ms
```

Cold is unchanged as expected — the cold path still decodes the full log. The saving is on the
client side: `replaceWindow()` rebuilds every context for the received window, then ChatFlow
renders all rows without virtualization. Cutting records 60-65% cuts that work proportionally.

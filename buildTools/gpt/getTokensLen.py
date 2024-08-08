import tiktoken
import json
import sys

encoding = tiktoken.encoding_for_model("text-embedding-ada-002")

sections = None

for line in sys.stdin:
    line = line.rstrip()
    sections = json.loads(line)
    break

num_tokens = []

for section in sections:
    tokens = len(encoding.encode(section))
    num_tokens.append(tokens)

print(num_tokens)

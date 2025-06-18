# from watchdog.observers import Observer
# from watchdog.events import FileSystemEventHandler
# import subprocess
# import time
# import os

# class ScriptChangeHandler(FileSystemEventHandler):
#     def __init__(self, script_name, url_file):
#         self.script_name = script_name
#         self.url_file = url_file

#     def on_modified(self, event):
#         if event.src_path.endswith(self.script_name):
#             print(f"[INFO] Detected change in {self.script_name}")

#             try:
#                 with open(self.url_file, "r") as f:
#                     audio_url = f.read().strip()

#                 if not audio_url:
#                     print("[ERROR] latest_url.txt is empty. Upload an audio file first.")
#                 else:
#                     print(f"[INFO] Running script with URL: {audio_url}")
#                     subprocess.run(["python3", self.script_name, audio_url])
#                     print("------------------------------------------------------")

#             except FileNotFoundError:
#                 print(f"[ERROR] {self.url_file} not found.")

# if __name__ == "__main__":
#     script_to_watch = "audiotonotes.py"
#     url_file = "latest_url.txt"
#     directory = os.path.abspath(".")

#     print(f"[WATCHDOG] Watching {script_to_watch} for changes...")

#     event_handler = ScriptChangeHandler(script_to_watch, url_file)
#     observer = Observer()
#     observer.schedule(event_handler, path=directory, recursive=False)
#     observer.start()

#     try:
#         while True:
#             time.sleep(1)
#     except KeyboardInterrupt:
#         observer.stop()
#     observer.join()

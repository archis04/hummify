
import os
import sys
import subprocess
import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class PythonHandler(FileSystemEventHandler):
    def __init__(self):
        self.current_process = None
    
    def on_modified(self, event):
        if event.src_path.endswith('.py'):
            print(f"\n--- Reloading due to change in {os.path.basename(event.src_path)} ---")
            self.restart_script()
    
    def restart_script(self):
        if self.current_process:
            self.current_process.terminate()
        self.current_process = subprocess.Popen(
            [sys.executable, "audiotonotes.py"],
            stdin=sys.stdin,
            stdout=sys.stdout,
            stderr=sys.stderr
        )

if __name__ == "__main__":
    path = os.getcwd()
    event_handler = PythonHandler()
    observer = Observer()
    observer.schedule(event_handler, path, recursive=True)
    observer.start()
    
    # Initial run
    event_handler.restart_script()
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
        if event_handler.current_process:
            event_handler.current_process.terminate()
    observer.join()
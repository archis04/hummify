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
        
        # Define the correct absolute path to audiotonotes.py
        # watcher.py is at /app/watcher.py
        # audiotonotes.py is at /app/python/audiotonotes.py
        # So, we need to go into the 'python' subfolder from watcher.py's directory
        audiotonotes_script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "python", "audiotonotes.py")
        
        self.current_process = subprocess.Popen(
            [sys.executable, audiotonotes_script_path], # <--- CHANGE THIS LINE!
            stdin=sys.stdin,
            stdout=sys.stdout,
            stderr=sys.stderr
        )

if __name__ == "__main__":
    # The path to watch should be the 'python' folder, where the scripts it needs to watch are
    # This is /app/python/ inside the container
    path_to_watch = os.path.join(os.path.dirname(os.path.abspath(__file__)), "python") 
    
    event_handler = PythonHandler()
    observer = Observer()
    observer.schedule(event_handler, path_to_watch, recursive=True)
    observer.start()
    
    # # Initial run
    # event_handler.restart_script()
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
        if event_handler.current_process:
            event_handler.current_process.terminate()
    observer.join()